
module Jekyll 
	module RelativeLinkFixer 		
		
		def fix_relative_links (input)
			
			for tag in @context.registers[:site].config["relative_links_tags_to_fix"]
				input = input.gsub(/(?<capture>#{tag}=('|"))\//, '\k<capture>' + @context.registers[:site].config["production_url"] + '/')
			end				
			
			return input
		end 
	
	end
end

Liquid::Template.register_filter(Jekyll::RelativeLinkFixer)